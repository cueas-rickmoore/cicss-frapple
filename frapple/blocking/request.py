
from csftool.blocking.request import CsfToolBlockingRequestManager

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostBlockingRequestManager(CsfToolBlockingRequestManager):

    def __init__(self, server_config, log_filepath=None):
        # initialize requirements inherited from the base request manager
        CsfToolBlockingRequestManager.__init__(self, server_config,
                                                     log_filepath)

