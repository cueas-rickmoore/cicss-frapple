#!/Users/rem63/venvs/frost/bin/python

import os, sys
from datetime import datetime
from dateutil.relativedelta import relativedelta

import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot

from frost.functions import fromConfig

from frost.apple.factory import AppleGridFactory
from frost.apple.functions import getAppleVariety

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from optparse import OptionParser
parser = OptionParser()

parser.add_option('-t', action='store', dest='temp_source', default='reported')
parser.add_option('-p', action='store', dest='point', default="-76.5,42,45")
parser.add_option('-v', action='store_true', dest='verbose', default=False)
parser.add_option('-y', action='store_true', dest='test_file', default=False)
parser.add_option('-z', action='store_true', dest='debug', default=False)

options, args = parser.parse_args()

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

temp_source = options.temp_source
test_file = options.test_file
# coordinates
ll = options.point.split(',')
target_lon = float(ll[0].strip())
target_lat = float(ll[1].strip())

# apple variety config
variety = getAppleVariety(args[0])
# chill model
model = fromConfig('crops.apple.chill.%s.self' % args[1])

# get the date span
year = int(args[2])
month = int(args[3])
day = int(args[4])
start_date = datetime(year,month,day)
year = int(args[5])
month = int(args[6])
day = int(args[7])
end_date 

# filter annoying numpy warnings
warnings.filterwarnings('ignore',"All-NaN axis encountered")
warnings.filterwarnings('ignore',"All-NaN slice encountered")
warnings.filterwarnings('ignore',"invalid value encountered in greater")
warnings.filterwarnings('ignore',"invalid value encountered in less")
warnings.filterwarnings('ignore',"Mean of empty slice")
# MUST ALSO TURN OFF WARNING FILTERS AT END OF SCRIPT !!!!!

factory = AppleGridFactory()
target_year = factory.getTargetYear(start_date)
visualizer = factory.getVarietyVisualizer(target_year, variety, 'r', test_file)
gdd_thresholds = visualizer.gddThresholds(model.name)

temp_manager = factory.getTempGridManager(target_year, 'r', test_file)
mint_dataset = '%s.mint' % temp_source
mint = temp_manager.getDataAtNode(mint_dataset, target_lon, target_lat,
                                  start_date, end_date

for lo_gdd_th, hi_gdd_th in gdd_thresholds:
    visualizer.plotKillVsStageAtPoint(target_lon, target_lat, model, start_date,
                                      end_date, lo_gdd_th, hi_gdd_th, mint,
                                      test_file)

# turn annoying numpy warnings back on
warnings.resetwarnings()
